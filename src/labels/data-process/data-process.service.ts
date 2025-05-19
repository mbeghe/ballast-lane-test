import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ParsedIndication } from '../interfaces/parsed-indication.interface';

@Injectable()
export class DataProcessService {
  async processXML(xml: string): Promise<ParsedIndication[]> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      trimValues: true,
      processEntities: true,
      ignoreDeclaration: true,
      removeNSPrefix: true,
      preserveOrder: true,
    });

    const parsed = parser.parse(xml);
    const document = this.getNode(parsed, 'document');
    const docComponent = this.getNode(document, 'component');
    const structuredBody = this.getNode(docComponent, 'structuredBody');
    const components = this.getAllNodes(structuredBody, 'component');

    const indicationWrapper = components.find((comp) => {
      const section = this.getNode(comp, 'section');
      const titleNode = this.getNode(section, 'title');
      const titleText = this.getText(titleNode).toLowerCase();
      return titleText.includes('indication');
    });

    if (!indicationWrapper) return [];

    const indicationSection = this.getNode(indicationWrapper, 'section');
    const subcomponents = this.getAllNodes(indicationSection, 'component');

    return subcomponents.map((comp) => {
      const section = this.getNode(comp, 'section');
      const titleNode = this.getNode(section, 'title');
      const textNode = this.getNode(section, 'text');

      const rawTitle = this.getText(titleNode);
      const cleanedTitle = rawTitle.replace(/^\d+(\.\d+)*\s*/, '');
      const description = this.extractTextFromParagraphs(textNode);

      return {
        title: cleanedTitle.trim(),
        description: description.trim(),
      };
    });
  }

  private extractTextFromParagraphs(textNode: any): string {
    if (!textNode) return '';

    const paragraphs = this.getAllNodes(textNode, 'paragraph');
    const result: string[] = [];

    for (const para of paragraphs) {
      result.push(this.getText(para));
    }

    return result.join(' ').replace(/\s+/g, ' ').trim();
  }

  private getNode(arr: any[], key: string): any | undefined {
    if (!Array.isArray(arr)) return undefined;
    return arr.find((item) => Object.hasOwn(item, key))?.[key];
  }

  private getAllNodes(arr: any[], key: string): any[] {
    if (!Array.isArray(arr)) return [];
    return arr.filter((item) => Object.hasOwn(item, key)).map((item) => item[key]);
  }

private getText(node: any): string {
  if (!node) return '';

  if (typeof node === 'string') return node;

  if (Array.isArray(node)) {
    return node.map((n) => this.getText(n)).join(' ');
  }

  if (typeof node === 'object') {
    const result: string[] = [];

    for (const [key, value] of Object.entries(node)) {
      if (key === '#text') {
        result.push(value as string);
      } else if (Array.isArray(value)) {
        result.push(value.map((v) => this.getText(v)).join(' '));
      } else if (typeof value === 'object') {
        result.push(this.getText(value));
      }
    }

    return result.join(' ');
  }

  return '';
}


}
