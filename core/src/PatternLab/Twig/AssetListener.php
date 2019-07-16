<?php

namespace PatternLab\Twig;

use PatternLab\Config;
use PatternLab\Listener;
use PatternLab\PatternEngine\Twig\TwigUtil;
use Symfony\Bridge\Twig\Extension\AssetExtension;
use Symfony\Component\Asset\PackageInterface;
use Symfony\Component\Asset\Packages;

final class AssetListener extends Listener
{
    public function __construct()
    {
        $this->addListener('twigPatternLoader.customize', 'onTwigPatternLoaderCustomize');
    }

    public function onTwigPatternLoaderCustomize()
    {
        $package = new class implements PackageInterface
        {
            public function getVersion($path)
            {
                return Config::getOption('cacheBuster');
            }

            public function getUrl($path)
            {
                return "../../{$path}?{$this->getVersion($path)}";
            }
        };

        TwigUtil::getInstance()->addExtension(new AssetExtension(new Packages($package)));
    }
}
