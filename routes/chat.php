<?php

use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

Route::post('/chat/stream', [ChatController::class, 'stream'])->name('chat.stream');

Route::middleware('auth')->group(function () {
    Route::post('/chat', [ChatController::class, 'store'])->name('chat.store');
    Route::get('/chat/{chat}', [ChatController::class, 'show'])->name('chat.show');
    Route::patch('/chat/{chat}', [ChatController::class, 'update'])->name('chat.update');
    Route::delete('/chat/{chat}', [ChatController::class, 'destroy'])->name('chat.destroy');
    Route::post('/chat/{chat}/stream', [ChatController::class, 'stream'])->name('chat.show.stream');
    Route::get('/chat/{chat}/title-stream', [ChatController::class, 'titleStream'])->name('chat.title.stream');
    Route::post('/chat/upload-image', [ChatController::class, 'uploadImage'])->name('chat.upload-image');
});
