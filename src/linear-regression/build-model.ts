import * as tf from '@tensorflow/tfjs';

export const buildModel = (name: string) => {
    let model: tf.Sequential;
    // Creates a tf.Sequential model. 
    // A sequential model is any model where the outputs of one layer are the inputs to the next layer, 
    // i.e. the model topology is a simple 'stack' of layers, with no branching or skipping.
    model = tf.sequential({
        name: name
    });

    // Adds a layer instance on top of the layer stack.
    // no hidden layers, linear activation
    model.add(tf.layers.dense({ units: 1, inputShape: [1], activation: 'linear' }));
    // model.add(tf.layers.dense({ units: 1, inputShape: [1], activation: 'linear' }));
    // model.add(tf.layers.dense({ units: 1, activation: 'softmax' }));
    
    model.compile({
        optimizer: tf.train.adam(),
        loss: "meanSquaredError",
    });
    return model;
}
