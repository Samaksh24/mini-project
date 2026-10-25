import { toFile } from "@imagekit/nodejs";
import imagekit from "../config/imagekit.js";

const uploadToImageKit = async (buffer, fileName) => {
    const file = await toFile(buffer, fileName);

    const response = await imagekit.files.upload({
        file,
        fileName
    });

    return response.url;
};

export default uploadToImageKit;