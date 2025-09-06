<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Remova o constraint antigo
        DB::statement("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check");

        // Recrie aceitando 'feedback'
        DB::statement("
            ALTER TABLE messages
            ADD CONSTRAINT messages_type_check
            CHECK (type IN ('prompt','response','error','feedback'))
        ");
    }

    public function down(): void
    {
        // Volta ao original sem 'feedback'
        DB::statement("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check");

        DB::statement("
            ALTER TABLE messages
            ADD CONSTRAINT messages_type_check
            CHECK (type IN ('prompt','response','error'))
        ");
    }
};