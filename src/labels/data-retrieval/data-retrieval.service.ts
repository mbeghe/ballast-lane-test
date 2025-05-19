import { Injectable, Logger } from '@nestjs/common';
import { ICD10Code } from '../interfaces/icd10-code.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class DataRetrievalService {
  private readonly logger = new Logger(DataRetrievalService.name);
  private dailyMedBase: string;
  private icd10ApiBase: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const dailyMedBase = this.configService.get<string>('DAILYMED_API_BASE');
    if (!dailyMedBase) {
      this.logger.error(
        'DAILYMED_API_BASE not defined in environment variables!',
      );
      throw new Error(
        'DAILYMED_API_BASE not defined in environment variables!',
      );
    }
    const icd10ApiBase = this.configService.get<string>('ICD10_API_BASE');
    if (!icd10ApiBase) {
      this.logger.error('ICD10_API_BASE not defined in environment variables!');
      throw new Error('ICD10_API_BASE not defined in environment variables!');
    }
    this.icd10ApiBase = icd10ApiBase;
    this.dailyMedBase = dailyMedBase;
  }

  async getProgramIdByLabel(label: string): Promise<string | null> {
    const url = `${this.dailyMedBase}/spls.json?title=${encodeURIComponent(label)}`;
    this.logger.verbose(`Fetching programId for label: ${label}`);
    try {
      const response = await this.httpService.axiosRef.get(url);
      const { data } = response.data;
      if (data?.length) {
        this.logger.debug(
          `Found programId ${data[0].setid} for label: ${label}`,
        );
        return data[0].setid;
      }
      this.logger.warn(`No programId found for label: ${label}`);
      return null;
    } catch (error: any) {
      this.logger.error(
        `Error fetching programId for label ${label}: ${error?.message ?? error}`,
      );
      return null;
    }
  }

  async getXMLByProgramId(programId: string): Promise<string> {
    const url = `${this.dailyMedBase}/spls/${programId}.xml`;
    this.logger.verbose(`Fetching XML for programId: ${programId}`);
    try {
      const response = await this.httpService.axiosRef.get(url, {
        responseType: 'text',
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Error fetching XML for programId ${programId}: ${error?.message ?? error}`,
      );
      throw error;
    }
  }

  async getICD10Codes(term: string): Promise<ICD10Code[]> {
    const url = `${this.icd10ApiBase}?sf=name&terms=${encodeURIComponent(term)}`;
    this.logger.verbose(`Fetching ICD10 codes for term: "${term}"`);
    try {
      const response = await this.httpService.axiosRef.get(url);
      const icdData = response.data;
      const codes: ICD10Code[] = [];
      if (icdData && Array.isArray(icdData[1]) && Array.isArray(icdData[3])) {
        for (let i = 0; i < icdData[1].length; i++) {
          codes.push({
            code: icdData[1][i],
            title: icdData[3][i][1],
          });
        }
      }
      this.logger.debug(
        `Found ${codes.length} ICD10 codes for term: "${term}"`,
      );
      return codes;
    } catch (error: any) {
      this.logger.error(
        `Error fetching ICD10 codes for term "${term}": ${error?.message ?? error}`,
      );
      return [];
    }
  }
}
