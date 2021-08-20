
import tf from '@tensorflow/tfjs-node'

export async function getTensor(buffer) {
  const tensor = tf.tidy(() => tf.node.decodeImage(buffer).toFloat().expandDims());
  return tensor;
}