<?php

namespace PatternLab\Twig;

use PatternLab\Listener;
use PatternLab\PatternData;

final class PseudoPatternsListener extends Listener
{
    public function __construct()
    {
        $this->addListener('patternData.codeHelperStart', 'onPatternDataGatherEnd');
    }

    public function onPatternDataGatherEnd(): void
    {
        $storePatternData = PatternData::get();

        foreach ($storePatternData as $key => $data) {
            if ('pattern' !== $data['category'] || true === $data['hidden']) {
                continue;
            }

            if (isset($data['pseudo'])) {
                PatternData::setPatternOption($data['original'], 'category', 'skip-this');
            }
        }
    }
}
