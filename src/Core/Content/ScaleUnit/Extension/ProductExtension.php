<?php declare(strict_types=1);

namespace Shopware\Core\Content\ScaleUnit\Extension;

use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityExtension;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\CascadeDelete;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\Framework\Log\Package;

/**
 * @internal
 */
#[Package('inventory')]
class ProductExtension extends EntityExtension
{
    public function getDefinitionClass(): string
    {
        return ProductDefinition::class;
    }

    public function extendFields(FieldCollection $collection): void
    {
        $collection->add(
            (new ManyToManyAssociationField('weightUnits', 'measuring_display_unit.definition', 'product_measuring_display_unit.definition', 'product_id', 'weight_unit_id'))->addFlags(new CascadeDelete())
        );

        $collection->add(
            (new ManyToManyAssociationField('lengthUnits', 'measuring_display_unit.definition', 'product_measuring_display_unit.definition', 'product_id', 'length_unit_id'))->addFlags(new CascadeDelete())
        );
    }

    public function getEntityName(): string
    {
        return ProductDefinition::ENTITY_NAME;
    }
}
