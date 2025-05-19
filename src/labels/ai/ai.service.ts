import { Injectable, Logger } from '@nestjs/common';
import { ICD10Code } from '../interfaces/icd10-code.interface';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async suggestICD10Code(
    term: string,
    options?: ICD10Code[],
  ): Promise<ICD10Code | null> {
    let prompt = `Given the following clinical indication: "${term}", return the most appropriate ICD-10 code as a JSON object with "code" and "title" fields only.`;

    if (options && options.length > 0) {
      prompt += `\nPossible options are: ${options
        .map((o) => `${o.code} (${o.title})`)
        .join(', ')}. Pick the best match if applicable.`;
    }
    prompt += `\nRespond ONLY with a single-line valid JSON, e.g.: {"code": "J45", "title": "Asthma"}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a medical coder assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50,
        temperature: 0.1,
      });

      const content = completion.choices[0].message?.content?.trim() ?? '';

      try {
        const result = JSON.parse(content);
        if (result?.code && result?.title) {
          this.logger.log(
            `AI mapped "${term}" to ICD10: ${result.code} (${result.title})`,
          );
          return { code: result.code, title: result.title };
        }
        this.logger.warn(
          `AI response did not contain code/title fields for term "${term}": ${content}`,
        );
      } catch (e) {
        this.logger.warn(
          `Failed to parse AI response as JSON for term "${term}": ${content}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `OpenAI API error while mapping term "${term}": ${error?.message ?? error}`,
      );
    }
    return null;
  }
}
