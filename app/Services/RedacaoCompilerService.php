<?php

namespace App\Services;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class RedacaoCompilerService
{
    public function __construct(
        private readonly string $pythonBin = '/usr/bin/python3',
    ) {}

    public function compile(
        string $userInput,
        ?string $redacaoTexto = null,
        ?string $imageData = null,
        int $timeout = 20
    ): array {
        $args = [
            $this->pythonBin,
            '-m', 'compiler.cli',
            '--user_input', $userInput,
        ];

        if (!empty($redacaoTexto)) {
            $args[] = '--redacao_texto';
            $args[] = $redacaoTexto;
        }

        if (!empty($imageData)) {
            $args[] = '--image_data';
            $args[] = $imageData;
        }

        $process = new Process($args, base_path());
        $process->setTimeout($timeout);

        $process->setEnv([
            'PYTHONIOENCODING' => 'utf-8',
            'PYTHONPATH'       => base_path(),
        ]);

        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $output = trim($process->getOutput());
        $data = json_decode($output, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException(
                'Falha ao decodificar JSON do compilador: ' . json_last_error_msg() . " | Saída: " . $output
            );
        }

        return $data;
    }
}
