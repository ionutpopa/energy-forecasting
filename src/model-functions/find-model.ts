import * as tf from '@tensorflow/tfjs'
import path from 'path'
import fs from 'fs'
import logger from '../utils/formatLogs'
import { loadModel } from './load-model'

export const findModel: (modelName: string) => Promise<tf.LayersModel> = async (modelName) => {
    const modelDir = path.join(__dirname, '..', 'models');

    if (!fs.existsSync(modelDir)) {
        logger("No model to be loaded... Will create one")
    }

    const modelPath = `file://${modelDir}/${modelName?.replace(" ", "_")?.toLowerCase()}/model.json`

    const model = await loadModel(modelPath)

    logger(`Loaded model from: ${modelPath}`)

    model.compile({
        optimizer: tf.train.adam(),
        loss: "meanSquaredError",
    });

    return model
}