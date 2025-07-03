const API_BASE_URL = 'http://localhost:8000/api';

export interface CreatePostRequest {
  topic?: string;
  url?: string;
  platform: 'linkedin' | 'twitter';
  image_wanted: boolean;
}

export interface CreatePostResponse {
  session_id: string;
  message: string;
}

export interface HumanFeedbackRequest {
  session_id: string;
  response_type: string;
  response_data: any;
}

export interface InterruptData {
  content: string;
  type: string;
}

export interface CompletionData {
  post_draft: string;
  image_url?: string;
  upload_success: boolean;
  post_url?: string;
}

export interface ApiResponse {
  type: 'interrupt' | 'completion' | 'error';
  data: InterruptData | CompletionData | { message: string };
}

export class ApiClient {
  static async createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
    const response = await fetch(`${API_BASE_URL}/create-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`);
    }

    return response.json();
  }

  static async streamExecution(sessionId: string, onData: (data: any) => void): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/stream/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to start streaming: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onData(data);
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  static async sendHumanFeedback(request: HumanFeedbackRequest): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/human-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to send feedback: ${response.statusText}`);
    }

    return response.json();
  }

  static async getSessionStatus(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }
} 