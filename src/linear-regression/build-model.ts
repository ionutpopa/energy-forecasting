import * as tf from '@tensorflow/tfjs';

export const buildModel = (name: string, featureTensor: tf.Tensor<tf.Rank>) => {
    let model: tf.Sequential;
    // Creates a tf.Sequential model. 
    // A sequential model is any model where the outputs of one layer are the inputs to the next layer, 
    // i.e. the model topology is a simple 'stack' of layers, with no branching or skipping.
    model = tf.sequential({
        name: name
    });
    // Adds a layer instance on top of the layer stack.
    model.add(
        // no hidden layers, linear activation
        tf.layers.dense({ units: 1, inputShape: [featureTensor?.shape[1] || 1], activation: "sigmoid" })
    );
    // model.add(
    //     tf.layers.dense({ units: 1, activation: 'softmax' })
    // );
    // model.add(
    //     tf.layers.dense({ units: 1, activation: 'linear' })
    // );
    
    model.compile({
        optimizer: tf.train.sgd(0.001),
        loss: "meanSquaredError",
    });
    return model;
}
