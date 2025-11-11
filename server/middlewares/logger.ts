import type {
  LanguageModelV2Middleware,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";

export const yourLogMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    console.info("doGenerate called");
    console.info(`params: ${JSON.stringify(params, null, 2)}`);

    const result = await doGenerate();

    console.info("doGenerate finished");
    console.info(`generated text: ${JSON.stringify(result.content, null, 2)}`);

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    console.info("doStream called");
    console.info(`params: ${JSON.stringify(params, null, 2)}`);

    const { stream, ...rest } = await doStream();

    let generatedText = "";
    const textBlocks = new Map<string, string>();

    const transformStream = new TransformStream<
      LanguageModelV2StreamPart,
      LanguageModelV2StreamPart
    >({
      transform(chunk, controller) {
        switch (chunk.type) {
          case "text-start": {
            textBlocks.set(chunk.id, "");
            break;
          }
          case "text-delta": {
            const existing = textBlocks.get(chunk.id) ?? "";
            textBlocks.set(chunk.id, existing + chunk.delta);
            generatedText += chunk.delta;
            break;
          }
          case "text-end": {
            console.info(
              `Text block ${chunk.id} completed:`,
              textBlocks.get(chunk.id),
            );
            break;
          }
        }

        controller.enqueue(chunk);
      },

      flush() {
        console.info("doStream finished");
        console.info(`generated text: ${generatedText}`);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
