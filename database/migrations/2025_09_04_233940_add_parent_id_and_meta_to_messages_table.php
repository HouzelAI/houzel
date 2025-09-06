<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('chat_id');
            $table->json('meta')->nullable()->after('images');

            $table->foreign('parent_id')->references('id')->on('messages')->onDelete('cascade');
            $table->index('parent_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['parent_id']);
            $table->dropIndex(['type']);
            $table->dropColumn(['parent_id', 'meta']);
        });
    }
};