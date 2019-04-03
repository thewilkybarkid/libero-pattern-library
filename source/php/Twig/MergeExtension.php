<?php

namespace Libero\PatternLibrary\Twig;

use Closure;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;
use Twig\TwigFilter;
use function array_merge_recursive;
use function is_iterable;

final class MergeExtension extends AbstractExtension implements GlobalsInterface
{
    public function getFilters(): iterable
    {
        yield new TwigFilter('merge_recursive', Closure::fromCallable([$this, 'mergeRecursive']));
    }

    private function mergeRecursive(iterable $one, iterable $two): iterable
    {
        return array_merge_recursive($this->toArray($one), $this->toArray($two));
    }

    private function toArray(iterable $iterable): array
    {
        $result = [];

        foreach ($iterable as $key => $value) {
            if (is_iterable($value)) {
                $value = $this->toArray($value);
            }

            $result[$key] = $value;
        }

        return $result;
    }
}
