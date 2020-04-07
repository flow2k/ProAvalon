import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatResponse } from '../../proto/bundle';
import { getProtoTimestamp } from '../../proto/timestamp';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [ChatController],
      providers: [ChatService, ChatGateway],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store messages correctly', () => {
    const msg = ChatResponse.create({
      text: 'test',
      username: 'asdf',
      timestamp: getProtoTimestamp(),
      type: ChatResponse.ChatResponseType.CHAT,
    });
    expect(service.storeMessage(msg)).toEqual(msg);
    expect(service.getMessages()[0]).toEqual(msg);
    expect(service.getMessages().length).toEqual(1);
  });

  it('should not overflow past 50 messages', () => {
    for (let i = 0; i < 60; i += 1) {
      const msg = ChatResponse.create({
        text: 'test',
        username: 'asdf',
        timestamp: getProtoTimestamp(),
        type: ChatResponse.ChatResponseType.CHAT,
      });
      expect(service.storeMessage(msg)).toEqual(msg);
    }
    expect(service.getMessages().length).toEqual(50);
  });
});