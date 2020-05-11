const rs2 = require('@things-factory/node-librealsense2')

module.exports = function (RED) {
  function RealsenseNode(config) {
    RED.nodes.createNode(this, config)
    var node = this
    node.on('input', function (msg) {
      let colorizer = new rs2.Colorizer()
      let pipeline = new rs2.Pipeline()

      pipeline.start()

      for (let i = 0; i < 30; i++) {
        pipeline.waitForFrames()
      }

      let frameset = pipeline.waitForFrames()
      let output = {}
      for (let i = 0; i < frameset.size; i++) {
        let frame = frameset.at(i)
        if (frame instanceof rs2.VideoFrame) {
          if (frame instanceof rs2.DepthFrame) {
            frame = colorizer.colorize(frame)
          }

          let streamType = frame.profile.streamType
          let pngFile = (output[`${streamType}-image-filename`] =
            rs2.stream.streamToString(frame.profile.streamType) + '.png')
          rs2.util.writeFrameToFile(pngFile, frame, 'png')

          let csvFile = (output[`${streamType}-metadata-filename`] =
            rs2.stream.streamToString(frame.profile.streamType) + '-metadata.csv')
          rs2.util.writeFrameMetadataToFile(csvFile, frame)
        }
      }

      pipeline.stop()
      pipeline.destroy()
      rs2.cleanup()

      msg = {
        ...msg,
        ...output
      }

      node.send(msg)

      // const colorizer = new rs2.Colorizer();  // This will make depth image pretty
      // const pipeline = new rs2.Pipeline();  // Main work pipeline of RealSense camera
      // pipeline.start();  // Start camera

      // const frameset = pipeline.waitForFrames();  // Get a set of frames
      // const depth = frameset.depthFrame;  // Get depth data
      // const depthRGB = colorizer.colorize(depth);  // Make depth image pretty
      // const color = frameset.colorFrame;  // Get RGB image

      // // TODO: use frame buffer data
      // depthRGB.getData();
      // color.getData();

      // // Before exiting, do cleanup.
      // rs2.cleanup();
    })
  }

  RED.nodes.registerType('realsense', RealsenseNode)
}
