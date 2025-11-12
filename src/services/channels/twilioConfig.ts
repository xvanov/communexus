/**
 * Twilio Configuration Service
 *
 * This module provides configuration and initialization for the Twilio SDK.
 * It handles credential management, client initialization, and environment
 * variable support for Twilio SMS integration.
 *
 * @example
 * ```typescript
 * import { getTwilioClient, TwilioCredentials } from './twilioConfig';
 *
 * const credentials: TwilioCredentials = {
 *   accountSid: process.env.TWILIO_ACCOUNT_SID!,
 *   authToken: process.env.TWILIO_AUTH_TOKEN!,
 *   phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
 * };
 *
 * const twilioClient = getTwilioClient(credentials);
 * ```
 */

import Twilio from 'twilio';

/**
 * Twilio Credentials Interface
 *
 * Defines the structure for Twilio authentication credentials.
 * These should be stored securely (e.g., Firebase Secrets Manager)
 * and provided at runtime.
 */
export interface TwilioCredentials {
  /**
   * Twilio Account SID
   * @example 'AC00000000000000000000000000000000'
   */
  accountSid: string;

  /**
   * Twilio Auth Token
   * @example 'your_auth_token_here'
   */
  authToken: string;

  /**
   * Twilio Phone Number (E.164 format)
   * @example '+15551234567'
   */
  phoneNumber: string;
}

/**
 * Get Twilio Client Instance
 *
 * Initializes and returns a Twilio client instance using the provided credentials.
 * The client is used for sending SMS messages, checking message status, and
 * handling webhook requests.
 *
 * @param credentials - Twilio credentials (accountSid, authToken, phoneNumber)
 * @returns Twilio client instance
 * @throws Error if credentials are invalid or missing
 *
 * @example
 * ```typescript
 * const credentials: TwilioCredentials = {
 *   accountSid: process.env.TWILIO_ACCOUNT_SID!,
 *   authToken: process.env.TWILIO_AUTH_TOKEN!,
 *   phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
 * };
 *
 * const client = getTwilioClient(credentials);
 * ```
 */
export function getTwilioClient(
  credentials: TwilioCredentials
): Twilio.Twilio {
  // Validate credentials
  if (!credentials.accountSid) {
    throw new Error('Twilio Account SID is required');
  }
  if (!credentials.authToken) {
    throw new Error('Twilio Auth Token is required');
  }
  if (!credentials.phoneNumber) {
    throw new Error('Twilio Phone Number is required');
  }

  // Validate phone number format (E.164)
  if (!/^\+[1-9]\d{1,14}$/.test(credentials.phoneNumber)) {
    throw new Error(
      `Invalid phone number format. Expected E.164 format (e.g., +15551234567), got: ${credentials.phoneNumber}`
    );
  }

  // Initialize and return Twilio client
  return Twilio(credentials.accountSid, credentials.authToken);
}

/**
 * Get Twilio Credentials from Environment Variables
 *
 * Loads Twilio credentials from environment variables.
 * This is useful for development and testing environments.
 *
 * @returns Twilio credentials from environment variables
 * @throws Error if required environment variables are missing
 *
 * @example
 * ```typescript
 * const credentials = getTwilioCredentialsFromEnv();
 * const client = getTwilioClient(credentials);
 * ```
 */
export function getTwilioCredentialsFromEnv(): TwilioCredentials {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid) {
    throw new Error(
      'TWILIO_ACCOUNT_SID environment variable is required but not set'
    );
  }
  if (!authToken) {
    throw new Error(
      'TWILIO_AUTH_TOKEN environment variable is required but not set'
    );
  }
  if (!phoneNumber) {
    throw new Error(
      'TWILIO_PHONE_NUMBER environment variable is required but not set'
    );
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
  };
}







