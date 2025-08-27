<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    /** @use HasFactory<\Database\Factories\MessageFactory> */
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'type',
        'content',
        'images',
    ];

    protected $casts = [
        'type' => 'string',
        'images' => 'array',
    ];

    protected $appends = ['saved'];

    public function getSavedAttribute()
    {
        return true;
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }
}
