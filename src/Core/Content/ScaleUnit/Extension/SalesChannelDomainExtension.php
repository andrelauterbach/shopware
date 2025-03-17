<?php declare(strict_types=1);

namespace Shopware\Core\Content\ScaleUnit\Extension;

use Shopware\Core\Framework\DataAbstractionLayer\EntityExtension;
use Shopware\Core\Framework\DataAbstractionLayer\Field\FkField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\ApiAware;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToOneAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\Framework\Log\Package;
use Shopware\Core\System\SalesChannel\Aggregate\SalesChannelDomain\SalesChannelDomainDefinition;

/**
 * @internal
 */
#[Package('inventory')]
class SalesChannelDomainExtension extends EntityExtension
{
    public function getDefinitionClass(): string
    {
        return SalesChannelDomainDefinition::class;
    }

    public function extendFields(FieldCollection $collection): void
    {
        $collection->add((new FkField('measuring_system_id', 'measuringSystemId', 'measuring_system.definition'))->addFlags(new ApiAware()));

        $collection->add(
            new ManyToOneAssociationField('measuringSystem', 'measuring_system_id', 'measuring_system.definition', 'id')
        );
    }

    public function getEntityName(): string
    {
        return SalesChannelDomainDefinition::ENTITY_NAME;
    }
}
