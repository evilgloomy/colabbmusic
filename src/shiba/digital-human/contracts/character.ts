export interface DigitalHumanCharacter {
  id: string; displayName: string; brainProfile: string;
  speech: { provider: string; voiceId?: string };
  avatar: { provider: string; avatarId: string };
  defaultLanguage: string;
}
