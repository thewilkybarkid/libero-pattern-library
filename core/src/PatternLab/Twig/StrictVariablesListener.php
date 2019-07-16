<?php

namespace PatternLab\Twig;

use PatternLab\Listener;
use PatternLab\PatternEngine\Twig\TwigUtil;

final class StrictVariablesListener extends Listener
{
    public function __construct()
    {
        $this->addListener('twigPatternLoader.customize', 'onTwigPatternLoaderCustomize');
    }

    public function onTwigPatternLoaderCustomize()
    {
        TwigUtil::getInstance()->enableStrictVariables();
    }
}
