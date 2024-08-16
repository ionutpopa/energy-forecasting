import * as tf from '@tensorflow/tfjs';

// Singleton Pattern for TensorFlow.js Model
let modelInstance: tf.Sequential | null = null;

export const buildModel = (name: string) => {
    if (!modelInstance) {
         // Creates a tf.Sequential model. 
        // A sequential model is any model where the outputs of one layer are the inputs to the next layer, 
        // i.e. the model topology is a simple 'stack' of layers, with no branching or skipping.
        modelInstance = tf.sequential({
            name: name
        });
        // Adds a layer instance on top of the layer stack.
        modelInstance.add(
            // Creates a dense (fully connected) layer.
            tf.layers.dense({ units: 1, inputShape: [6] }) // 5 inputs for the 6 features
        );
        modelInstance.compile({
            optimizer: tf.train.sgd(0.01),
            loss: "meanSquaredError",
        });
    }
    return modelInstance;
}
