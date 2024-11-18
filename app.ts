import express, { Request, Response } from 'express';
import Dns, * as $Dns from '@alicloud/alidns20150109';
import Util from '@alicloud/tea-util';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import Console from '@alicloud/tea-console';
import * as $tea from '@alicloud/tea-typescript';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY


function initializeClient(regionId: string): Dns {
  const config = new $OpenApi.Config({
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    regionId: regionId
  });
  return new Dns(config);
}

async function getDomainRecords(client: Dns, domainName: string, RR: string, recordType: string) {
  const req = new $Dns.DescribeDomainRecordsRequest({});
  req.domainName = domainName;
  req.RRKeyWord = RR;
  req.type = recordType;
  
  const response = await client.describeDomainRecords(req);
  
  // Add exact match filter
  if (response?.body?.domainRecords?.record) {
    const exactMatch = response.body.domainRecords.record.find(
      record => record.RR === RR
    );
    if (exactMatch) {
      response.body.domainRecords.record = [exactMatch];
    } else {
      response.body.domainRecords.record = [];
    }
  }
  
  return response;
}

app.get('/change-ip', async (req: Request, res: Response): Promise<any> => {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Received request:`, {
    server: req.query.server,
    ip: req.query.ip,
    type: req.query.type
  });

  try {
    // Validate API key
    const key = req.query.key as string;
    if (key !== API_KEY) {
      console.warn(`[${new Date().toISOString()}] Invalid API key attempt`);
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Get and validate required parameters
    const server = req.query.server as string;
    const ip = req.query.ip as string;
    const type = (req.query.type as string) || 'ipv6';

    if (!server || !ip) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate record type
    if (type !== 'ipv4' && type !== 'ipv6') {
      return res.status(400).json({ error: 'Invalid record type' });
    }

    // Construct full domain name
    const domain = process.env.DOMAIN || ''
    // if domain is empty, return 400
    if (!domain) {
      return res.status(400).json({ error: 'DOMAIN is not set' });
    }
    const fullDomain = `${server}.${domain}`

    // Set record type
    const recordType = type === 'ipv4' ? 'A' : 'AAAA';

    
    console.log(`[${new Date().toISOString()}] Processing request for domain: ${fullDomain}, IP: ${ip}, Type: ${recordType}`);

    // Initialize client and update DNS record
    const regionId = 'cn-hangzhou';
    const client = initializeClient(regionId);

    // Get current DNS records
    console.log(`[${new Date().toISOString()}] Fetching existing DNS records...`);
    const records = await getDomainRecords(client, domain, server, recordType);
    const existingRecord = records?.body?.domainRecords?.record?.[0];

    if (existingRecord) {
      console.log(`[${new Date().toISOString()}] Found existing record:`, {
        recordId: existingRecord.recordId,
        currentValue: existingRecord.value
      });

      // Check if the IP value has changed
      if (existingRecord.value === ip) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`[${endTime.toISOString()}] No update needed - IP hasn't changed`, {
          duration: `${duration}ms`,
          domain: fullDomain,
          ip: ip,
          type: recordType
        });
        
        return res.json({
          success: true,
          message: 'No update needed - IP hasn\'t changed',
          details: {
            domain: fullDomain,
            ip: ip,
            type: recordType,
            operation: 'none'
          }
        });
      }

      // Update existing record only if IP has changed
      const updateRequest = new $Dns.UpdateDomainRecordRequest({});
      updateRequest.RR = server;
      updateRequest.recordId = existingRecord.recordId;
      updateRequest.value = ip;
      updateRequest.type = recordType;
      updateRequest.TTL = 60;

      await client.updateDomainRecord(updateRequest);
    } else {
      console.log(`[${new Date().toISOString()}] No existing record found, creating new record`);
      // Add new record
      const addRequest = new $Dns.AddDomainRecordRequest({});
      addRequest.domainName = domain;
      addRequest.RR = server;
      addRequest.type = recordType;
      addRequest.value = ip;
      addRequest.TTL = 60;

      await client.addDomainRecord(addRequest);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log(`[${endTime.toISOString()}] Operation completed successfully`, {
      duration: `${duration}ms`,
      operation: existingRecord ? 'update' : 'add',
      domain: fullDomain,
      ip: ip,
      type: recordType
    });

    res.json({
      success: true,
      message: existingRecord ? 'DNS record updated successfully' : 'DNS record added successfully',
      details: {
        domain: fullDomain,
        ip: ip,
        type: recordType,
        operation: existingRecord ? 'update' : 'add'
      }
    });

  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error(`[${endTime.toISOString()}] Operation failed`, {
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      error: 'Failed to update DNS record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

