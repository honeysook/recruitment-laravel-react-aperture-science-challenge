<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

if (Features::enabled(Features::resetPasswords())) {
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware(['guest'])
        ->name('password.email');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->middleware(['guest'])
        ->name('password.update');
}
