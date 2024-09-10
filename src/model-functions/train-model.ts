import * as tf from '@tensorflow/tfjs';
import logger from '../utils/formatLogs';

// Inputs and Labels

// Inputs (Features): These are the independent variables or predictors that the model uses to make predictions. 
// They are typically provided as a NumPy array or a TensorFlow tensor, and they should match the input shape expected by the model.

// Labels (Targets): These are the dependent variables or the ground truth values that the model tries to predict. 
// Labels are used to calculate the loss, which guides the training process. 
// They must correspond to the outputs that the model is supposed to generate.

export const trainModel = async (model: tf.Sequential | tf.LayersModel, inputTensor: tf.Tensor<tf.Rank>, labelTensor: tf.Tensor<tf.Rank>) => {
    return await model.fit(inputTensor, labelTensor, {
        // epochs: Integer number of times to iterate over the training data arrays.
        epochs: 10000, // iterations through data by the model
        shuffle: true,
        // batchSize: parseInt(process.env.BATCH_SIZE || "32"),
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                if (isNaN((logs as tf.Logs).loss)) {
                    logger(`NaN loss detected at epoch ${epoch}. Stopping training.`, 'error');
                    model.stopTraining = true;
                } else {
                    logger(`Epoch ${epoch}: loss = ${(logs as tf.Logs).loss}`);
                }
            }
        }
    });
}

// Multiple Linear Regression: y = b0*x1 + b1*x2 + ... + bn*xn + e
// y = dependent variable (what you are trying to predict)
// x = indepenet variable (the predictor)
// b0 = intercept (value of y when x = 0)
// b1 = slope (how much y changes for a unit change in x)
// e = error term (captures the variability in y that can't be explained by x)

// Understanding model.fit
// The model.fit function is at the core of the training process in TensorFlow. When you call model.fit, the following happens:
// - Forward Pass: The model processes the input data to generate predictions.
// - Loss Calculation: The difference (error) between the model's predictions and the actual target values (labels) is calculated using a loss function.
// - Backward Pass: The error is propagated back through the network, updating the model's weights using an optimizer.
// - Iteration: This process is repeated for a specified number of epochs (complete passes over the training data).