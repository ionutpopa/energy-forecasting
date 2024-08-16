import * as tf from '@tensorflow/tfjs';
import logger from '../utils/formatLogs';

export const trainModel = async (model: tf.Sequential, inputs: number[], labels: string[]) => {
    const inputTensor = tf.tensor2d(inputs);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    await model.fit(inputTensor, labelTensor, {
        // epochs: Integer number of times to iterate over the training data arrays.
        epochs: 100, // Increase for better accuracy
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                logger(`Epcoh ${epoch}: loss = ${(logs as tf.Logs).loss}`)
            }
        }
    });

    return model;
}