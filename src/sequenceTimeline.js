const clamp = (value) => Math.max(0, Math.min(1, value))

// Keep scroll choreography independent of the number of samples in each action.
export function frameAtProgress(progress, sequence) {
  const value = clamp(progress)
  const segment = sequence.scrollSegments?.find((item) => value <= item.endProgress)
  if (!segment) return Math.round(value * (sequence.frameCount - 1))
  const amount = clamp((value - segment.startProgress) / (segment.endProgress - segment.startProgress))
  return Math.round(segment.startFrame + amount * (segment.endFrame - segment.startFrame))
}

export function progressAtFrame(frame, sequence) {
  const index = Math.max(0, Math.min(sequence.frameCount - 1, frame))
  const segment = sequence.scrollSegments?.find((item) => index <= item.endFrame)
  if (!segment) return index / (sequence.frameCount - 1)
  const amount = (index - segment.startFrame) / (segment.endFrame - segment.startFrame)
  return segment.startProgress + amount * (segment.endProgress - segment.startProgress)
}
