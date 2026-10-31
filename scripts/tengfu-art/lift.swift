// 用 macOS Vision 的主體去背:lift <輸入.png> <輸出.png>
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: lift in.png out.png"); exit(2) }
let url = URL(fileURLWithPath: args[1])
guard let input = CIImage(contentsOf: url) else { print("cannot read"); exit(1) }
let handler = VNImageRequestHandler(ciImage: input)
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch { print("vision error \(error)"); exit(1) }
guard let obs = req.results?.first else { print("no subject"); exit(3) }
let mask = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
let maskImg = CIImage(cvPixelBuffer: mask)
let blend = CIFilter.blendWithMask()
blend.inputImage = input
blend.backgroundImage = CIImage(color: .clear).cropped(to: input.extent)
blend.maskImage = maskImg
let ctx = CIContext()
guard let out = blend.outputImage, let cs = CGColorSpace(name: CGColorSpace.sRGB) else { exit(1) }
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: cs)
print("ok \(obs.allInstances.count)")
