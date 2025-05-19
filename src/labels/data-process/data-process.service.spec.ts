import { Test, TestingModule } from '@nestjs/testing';
import { DataProcessService } from './data-process.service';
import { Logger } from '@nestjs/common';

describe('DataProcessService', () => {
  let service: DataProcessService;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataProcessService],
    }).compile();

    service = module.get<DataProcessService>(DataProcessService);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return parsed indications from valid XML', async () => {
    const xml = `
      <document xmlns="urn:hl7-org:v3">
        <component>
          <structuredBody>
            <component>
              <section>
                <title>1.1 Indications and Usage</title>
                <component>
                  <section>
                    <title>Asthma</title>
                    <text>
                      <paragraph>Patient has chronic asthma symptoms.</paragraph>
                    </text>
                  </section>
                </component>
                <component>
                  <section>
                    <title>Hypertension</title>
                    <text>
                      <paragraph>Blood pressure is consistently high.</paragraph>
                    </text>
                  </section>
                </component>
              </section>
            </component>
          </structuredBody>
        </component>
      </document>
    `;

    const result = await service.processXML(xml);
    expect(result).toEqual([
      {
        title: 'Asthma',
        description: 'Patient has chronic asthma symptoms.',
      },
      {
        title: 'Hypertension',
        description: 'Blood pressure is consistently high.',
      },
    ]);
  });

  it('should return an empty array if no structuredBody is found', async () => {
    const xml = `<document xmlns="urn:hl7-org:v3"></document>`;
    const result = await service.processXML(xml);
    expect(result).toEqual([]);
  });

  it('should return an empty array if no Indication section is found', async () => {
    const xml = `
      <document xmlns="urn:hl7-org:v3">
        <component>
          <structuredBody>
            <component>
              <section>
                <title>1.1 Allergies</title>
              </section>
            </component>
          </structuredBody>
        </component>
      </document>
    `;
    const result = await service.processXML(xml);
    expect(result).toEqual([]);
  });

  it('should handle missing text or paragraph gracefully', async () => {
    const xml = `
      <document xmlns="urn:hl7-org:v3">
        <component>
          <structuredBody>
            <component>
              <section>
                <title>Indications</title>
                <component>
                  <section>
                    <title>Diabetes</title>
                  </section>
                </component>
              </section>
            </component>
          </structuredBody>
        </component>
      </document>
    `;
    const result = await service.processXML(xml);
    expect(result).toEqual([
      {
        title: 'Diabetes',
        description: '',
      },
    ]);
  });

  it('should correctly flatten nested paragraphs', async () => {
    const xml = `
      <document xmlns="urn:hl7-org:v3">
        <component>
          <structuredBody>
            <component>
              <section>
                <title>Indication</title>
                <component>
                  <section>
                    <title>Mixed</title>
                    <text>
                      <paragraph>
                        <b>Severe</b> and <i>persistent</i> asthma.
                      </paragraph>
                    </text>
                  </section>
                </component>
              </section>
            </component>
          </structuredBody>
        </component>
      </document>
    `;
    const result = await service.processXML(xml);
    expect(result).toEqual([
      {
        title: 'Mixed',
        description: 'Severe and persistent asthma.',
      },
    ]);
  });
});
