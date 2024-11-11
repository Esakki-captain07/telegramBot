import mongoose from "./index.js";

const botSchema = new mongoose.Schema({
    title: { type: String, required: true },
    rating: { type: String, required: true },
    fileId: String,
    versions: [{ 
        quality: { type: String },
        language: { type: String },
        size: String, 
        fileId: { type: String },
        
    }],
    description: String,
    category: String, 
    movieUrl: String
}, {
    collection: 'movies',
    versionKey: false
});

const botModel = mongoose.model('movies', botSchema);
export default botModel;
