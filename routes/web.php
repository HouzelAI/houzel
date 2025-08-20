<?php

use Illuminate\Support\Facades\Route;

Route::get('/home', [\App\Http\Controllers\HomeController::class, 'index'])->name('landing.page');
Route::get('/', [\App\Http\Controllers\ChatController::class, 'index'])->name('home');

// Dashboard route removed - using chat as main page

// API routes
Route::get('/api/chats', [\App\Http\Controllers\Api\ChatController::class, 'index'])->name('api.chats.index');

require __DIR__.'/chat.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
