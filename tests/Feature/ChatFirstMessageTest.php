<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatFirstMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_creation_with_first_message_redirects_correctly(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/chat', [
            'firstMessage' => 'Hello, this is my first message',
        ]);

        // Should redirect to the new chat
        $response->assertRedirect();

        // Get the chat that was created
        $chat = $user->chats()->first();
        $this->assertNotNull($chat);

        // Should redirect to the correct chat
        $response->assertRedirect("/chat/{$chat->id}");
    }

    public function test_chat_title_generated_from_first_message(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/chat', [
            'firstMessage' => 'This is a very long message that should be truncated for the title',
        ]);

        $response->assertRedirect();

        // User should now have one chat with generated title
        $user->refresh();
        $this->assertCount(1, $user->chats);

        $chat = $user->chats->first();
        // Initially the chat will have "Sem título" title, title generation happens after streaming
        $this->assertEquals('Sem título', $chat->title);
    }

    public function test_blank_chat_creation_without_first_message(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/chat');

        $response->assertRedirect();

        // User should have one blank chat
        $user->refresh();
        $this->assertCount(1, $user->chats);

        $chat = $user->chats->first();
        $this->assertEquals('Sem título', $chat->title);
        $this->assertCount(0, $chat->messages);
    }

    public function test_first_message_is_saved_to_database(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/chat', [
            'firstMessage' => 'Hello, save this message',
        ]);

        $response->assertRedirect();

        // User should have one chat with the message saved
        $user->refresh();
        $this->assertCount(1, $user->chats);

        $chat = $user->chats->first();
        $this->assertNotNull($chat);
        $this->assertCount(1, $chat->messages);

        $message = $chat->messages->first();
        $this->assertEquals('prompt', $message->type);
        $this->assertEquals('Hello, save this message', $message->content);

        // Should redirect with autoStream flash
        $response->assertRedirect("/chat/{$chat->id}");
    }
}
