export class AudioBufferToWav {

    static convert(buffer, opt) {
        opt = opt || {};

        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = opt.float32 ? 3 : 1;
        const bitDepth = format === 3 ? 32 : 16;

        let result;
        if (numChannels === 2) {
            result = AudioBufferToWav.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            result = buffer.getChannelData(0);
        }

        return AudioBufferToWav.encodeWAV(result, format, sampleRate, numChannels, bitDepth);
    }

    private static encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
        const view = new DataView(buffer);

        /* RIFF identifier */
        AudioBufferToWav.writeString(view, 0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + samples.length * bytesPerSample, true);
        /* RIFF type */
        AudioBufferToWav.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        AudioBufferToWav.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, format, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        AudioBufferToWav.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, samples.length * bytesPerSample, true);
        if (format === 1) { // Raw PCM
            AudioBufferToWav.floatTo16BitPCM(view, 44, samples);
        } else {
            AudioBufferToWav.writeFloat32(view, 44, samples);
        }

        return buffer;
    }

    private static interleave(inputL, inputR) {
        const length = inputL.length + inputR.length;
        const result = new Float32Array(length);

        let index = 0;
        let inputIndex = 0;

        while (index < length) {
            result[index++] = inputL[inputIndex];
            result[index++] = inputR[inputIndex];
            inputIndex++;
        }
        return result;
    }

    private static writeFloat32(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 4) {
            output.setFloat32(offset, input[i], true);
        }
    }

    private static floatTo16BitPCM(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    private static writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}
