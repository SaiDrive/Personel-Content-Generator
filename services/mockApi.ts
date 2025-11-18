import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { User, UserImage, ContentItem, UserContext, ContentStatus, ContentType } from '../types';
import { ContentStatus as CS, ContentType as CT } from '../types';


// --- MOCK DATABASE ---
const DB_KEY = 'content-catalyst-db';

interface MockDB {
  user: User | null;
  context: UserContext;
  images: UserImage[];
  content: ContentItem[];
}

const getDB = (): MockDB => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to parse DB from localStorage", error);
  }
  return {
    user: null,
    context: { notes: '', links: '' },
    images: [],
    content: [],
  };
};

const saveDB = (db: MockDB) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (error) {
        console.error("Failed to save DB to localStorage. Data might be too large or invalid.", error);
    }
};

const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// --- API FUNCTIONS ---

export const loginWithGoogle = async (googleToken: string): Promise<{ token: string; user: User }> => {
  await simulateDelay();
  const db = getDB();
  const user: User = {
    id: 'user-123',
    name: 'Demo User',
    email: 'demo.user@example.com',
  };
  db.user = user;
  saveDB(db);
  const sessionToken = `mock-jwt-for-${user.id}-${Date.now()}`;
  localStorage.setItem('sessionToken', sessionToken);
  return { token: sessionToken, user };
};

export const logout = () => {
    const db = getDB();
    db.user = null;
    saveDB(db);
    localStorage.removeItem('sessionToken');
};

export const getMe = async (): Promise<User> => {
    await simulateDelay();
    const token = localStorage.getItem('sessionToken');
    if (!token) throw new Error("Unauthorized");
    const db = getDB();
    if (!db.user) throw new Error("User not found");
    return db.user;
};

export const getContext = async (): Promise<UserContext> => {
  await simulateDelay();
  return getDB().context;
};

export const saveContext = async (context: UserContext): Promise<{ success: true }> => {
  await simulateDelay(800);
  const db = getDB();
  db.context = context;
  saveDB(db);
  return { success: true };
};

export const getImages = async (): Promise<UserImage[]> => {
  await simulateDelay();
  return getDB().images;
};

export const getUploadUrl = async (fileName: string, contentType: string): Promise<{ uploadUrl: string; newImage: UserImage }> => {
    await simulateDelay();
    const db = getDB();
    const id = `img-${Date.now()}`;
    const newImage: UserImage = {
        id,
        name: fileName,
        url: '', // This will be populated by the frontend after "uploading"
    };
    db.images.push(newImage);
    saveDB(db);
    return {
        uploadUrl: `/mock-upload/${id}`,
        newImage,
    };
};

export const mockUploadFile = async (image: UserImage, dataUrl: string): Promise<UserImage> => {
    await simulateDelay(1500);
    const db = getDB();
    const dbImage = db.images.find(i => i.id === image.id);
    if (!dbImage) throw new Error("Image not found");
    dbImage.url = dataUrl;
    saveDB(db);
    return dbImage;
}

export const deleteImage = async (id: string): Promise<{ success: true }> => {
  await simulateDelay();
  const db = getDB();
  db.images = db.images.filter(img => img.id !== id);
  saveDB(db);
  return { success: true };
};

// --- REAL AI GENERATION ---

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject('Failed to read blob as base64');
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateContent = async (
    type: ContentType,
    context: UserContext,
    count: number,
    startImageId?: string
): Promise<ContentItem[]> => {
    const ai = getAi();
    const db = getDB();
    const startImage = db.images.find(img => img.id === startImageId);

    // 1. Generate headlines from context
    let headlines: string[] = [];
    try {
        const headlinePrompt = `Based on the following notes and links, generate ${count} unique, short, and catchy headlines suitable for a social media post. If the notes and links are empty, generate ${count} generic placeholder headlines about content creation or social media marketing.
        Notes: "${context.notes}"
        Links: "${context.links}"
        
        Return the result as a JSON array of strings. For example: ["Headline 1", "Headline 2"]`;
        
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: headlinePrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        headlines = JSON.parse(result.text);
        if (!headlines || headlines.length === 0) {
            throw new Error("AI returned no headlines.");
        }
    } catch (e) {
        console.error("Failed to generate headlines", e);
        throw new Error("Could not generate headlines from the context provided.");
    }
    
    const newContentItems: ContentItem[] = [];
    const generationPromises = headlines.map(async (headline, index) => {
        const newItem: ContentItem = {
            id: `content-${Date.now()}-${index}`,
            type: type,
            prompt: headline,
            data: '',
            status: CS.GENERATING,
        };

        try {
            switch (type) {
                case CT.TEXT:
                    newItem.data = headline;
                    newItem.status = CS.PENDING;
                    break;

                case CT.IMAGE: {
                    let imagePromptText = `Generate a visually appealing social media graphic. The graphic should prominently feature the text: "${headline}". Make the style modern, clean, and engaging.`;
                    const imageParts: ({ text: string; } | { inlineData: { data: string; mimeType: string; }; })[] = [];

                    if (startImage) {
                        imagePromptText = `Overlay the following text onto this image in a stylish and readable way: "${headline}"`;
                        const imageBlob = await dataUrlToBlob(startImage.url);
                        const base64Data = await blobToBase64(imageBlob);
                        imageParts.push({ inlineData: { data: base64Data, mimeType: imageBlob.type } });
                    }
                    
                    imageParts.push({ text: imagePromptText });

                    const imageResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: imageParts },
                        config: { responseModalities: [Modality.IMAGE] },
                    });
                    
                    const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(
                        (part) => 'inlineData' in part && part.inlineData
                    );

                    if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
                        newItem.data = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                        newItem.status = CS.PENDING;
                    } else {
                        console.error("Full API Response on image failure:", JSON.stringify(imageResponse, null, 2));
                        throw new Error("No image data returned from API.");
                    }
                    break;
                }
                
                case CT.VIDEO: {
                    const videoPayload: any = {
                        model: 'veo-3.1-fast-generate-preview',
                        prompt: `A short, looping motion graphic for social media with the text "${headline}" overlaid. The style should be dynamic and eye-catching.`,
                        config: { numberOfVideos: 1, aspectRatio: '1:1', resolution: '720p' },
                    };
                    if (startImage) {
                        const imageBlob = await dataUrlToBlob(startImage.url);
                        const base64Data = await blobToBase64(imageBlob);
                        videoPayload.image = { imageBytes: base64Data, mimeType: imageBlob.type };
                    }
                    const operation = await ai.models.generateVideos(videoPayload);
                    newItem.generationJobId = JSON.stringify(operation);
                    break;
                }
            }
        } catch (error: any) {
            console.error(`Failed to generate content for prompt: "${headline}"`, error);
            newItem.status = CS.ERROR;
            newItem.errorMessage = error.message || 'An unknown generation error occurred.';
        }
        return newItem;
    });

    const results = await Promise.all(generationPromises);
    newContentItems.push(...results);

    db.content.unshift(...newContentItems);
    saveDB(db);

    return newContentItems;
};

export const getContent = async (): Promise<ContentItem[]> => {
    const db = getDB();
    const generatingItems = db.content.filter(item => item.status === CS.GENERATING && item.generationJobId);

    if (generatingItems.length > 0) {
        const ai = getAi();
        let dbNeedsUpdate = false;

        await Promise.all(generatingItems.map(async (item) => {
            try {
                if (!item.generationJobId) return;
                const operationToPoll = JSON.parse(item.generationJobId);
                let operation = await ai.operations.getVideosOperation({ operation: operationToPoll });

                if (operation.done) {
                    dbNeedsUpdate = true;
                    const dbItem = db.content.find(i => i.id === item.id);
                    if (!dbItem) return;

                    if (operation.response) {
                        const videoUri = operation.response.generatedVideos?.[0]?.video?.uri;
                        if(videoUri) {
                            dbItem.data = `${videoUri}&key=${process.env.API_KEY}`;
                            dbItem.status = CS.PENDING;
                        } else {
                           throw new Error("Operation finished but no video URI was found.");
                        }
                    } else if (operation.error) {
                         throw new Error(`Video generation failed: ${operation.error.message} (Code: ${operation.error.code})`);
                    }
                    dbItem.generationJobId = undefined; // Clear the job ID
                }
            } catch (error: any) {
                 dbNeedsUpdate = true;
                 const dbItem = db.content.find(i => i.id === item.id);
                 if(dbItem) {
                    console.error(`Error polling for job ${item.generationJobId}`, error);
                    dbItem.status = CS.ERROR;
                    dbItem.errorMessage = error instanceof Error ? error.message : String(error);
                    dbItem.generationJobId = undefined;
                 }
            }
        }));

        if (dbNeedsUpdate) {
            saveDB(db);
        }
    }
    
    // Return a fresh copy from DB, sorted by time
    return getDB().content.sort((a, b) => {
        const idA = a.id.split('-')[1];
        const idB = b.id.split('-')[1];
        return parseInt(idB, 10) - parseInt(idA, 10);
    });
};


export const deleteContent = async (id: string): Promise<{ success: true }> => {
    await simulateDelay();
    const db = getDB();
    db.content = db.content.filter(item => item.id !== id);
    saveDB(db);
    return { success: true };
};

export const updateContentStatus = async (id: string, status: ContentStatus): Promise<ContentItem> => {
    await simulateDelay(200);
    const db = getDB();
    const item = db.content.find(i => i.id === id);
    if (!item) throw new Error("Content item not found");
    item.status = status;
    if (status !== CS.SCHEDULED) {
        item.schedule = undefined; // Clear schedule if status changes from scheduled
    }
    saveDB(db);
    return item;
};

export const updateContentSchedule = async (id: string, schedule: string): Promise<ContentItem> => {
    await simulateDelay(200);
    const db = getDB();
    const item = db.content.find(i => i.id === id);
    if (!item) throw new Error("Content item not found");
    item.schedule = schedule;
    item.status = CS.SCHEDULED;
    saveDB(db);
    return item;
}