import * as tf from '@tensorflow/tfjs'

export const loadModel = async (path: string) => {
    const model = await tf.loadLayersModel(path)
    return model
}