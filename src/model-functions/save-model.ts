import * as tf from '@tensorflow/tfjs'
import path from 'path'
import fs from 'fs'
import logger from '../utils/formatLogs';

export const saveModelLocally = async (modelName: string, model: tf.Sequential | tf.LayersModel) => {
    const saveDir = path.join(__dirname, '..', 'models');

    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
    }

    const savePath = `file://${saveDir}/${modelName?.replace(" ", "_")?.toLowerCase()}`

    logger(`savePath: ${savePath}`)

    const result = await model.save(savePath);

    return result;
}