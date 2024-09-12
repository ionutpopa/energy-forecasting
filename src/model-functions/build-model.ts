import * as tf from '@tensorflow/tfjs';
import { ActivationIdentifier } from '../types/model';


export const buildModel = (name: string, activationIdentifier: ActivationIdentifier) => {
    let model: tf.Sequential;
    // Creates a tf.Sequential model. 
    // A sequential model is any model where the outputs of one layer are the inputs to the next layer, 
    // i.e. the model topology is a simple 'stack' of layers, with no branching or skipping.
    model = tf.sequential({
        name: name
    });

    // Adds a layer instance on top of the layer stack.
    // no hidden layers, linear activation
    model.add(tf.layers.dense({ units: 1, inputShape: [1], activation: activationIdentifier }));

    // Add more hidden layers
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));

    // Add the output layer
    model.add(tf.layers.dense({ units: 1, activation: activationIdentifier }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: "meanSquaredError",
    });
    return model;
}