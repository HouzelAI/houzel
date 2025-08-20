<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Http\StreamedEvent;

class HomeController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        return Inertia::render('home');
    }
}
