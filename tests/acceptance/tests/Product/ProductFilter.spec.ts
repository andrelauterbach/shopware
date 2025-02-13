import { test, expect } from '@fixtures/AcceptanceTest';
import {PropertyGroup} from '@shopware-ag/acceptance-test-suite';

test('Customer should see unavailable filter disabled based on filtered manufacturer', async ({ ShopCustomer, TestDataService, StorefrontHome}) => {

    await TestDataService.setSystemConfig({ 'core.listing.disableEmptyFilterOptions': true });

    const propertyGroupColor = await TestDataService.createColorPropertyGroup();
    const propertyGroupText = await TestDataService.createTextPropertyGroup();
    const propertyGroupsColor: PropertyGroup[] = [];
    const propertyGroupsText: PropertyGroup[] = [];
    propertyGroupsColor.push(propertyGroupColor);
    propertyGroupsText.push(propertyGroupText);

    const manufacturer1 = await TestDataService.createBasicManufacturer({description: 'Test Description Manufacturer'});
    const parentProduct1 = await TestDataService.createBasicProduct({manufacturerId: manufacturer1.id});
    const manufacturer2 = await TestDataService.createBasicManufacturer({description: 'Test Description Manufacturer'});
    const parentProduct2 = await TestDataService.createBasicProduct({manufacturerId: manufacturer2.id});
    await TestDataService.createVariantProducts(parentProduct1, propertyGroupsColor, {description: 'Variant description'});
    await TestDataService.createVariantProducts(parentProduct2, propertyGroupsText, {description: 'Variant description'});

    await test.step('Select a manufacturer and verify that unavailable filter is disabled', async () => {
        await ShopCustomer.goesTo(StorefrontHome.url());
        await StorefrontHome.manufacturerFilter.click();
        await (await StorefrontHome.getManufacturerFilterItemByManufacturerName(manufacturer1.name)).click();
        await ShopCustomer.expects(await StorefrontHome.getPropertyFilterByFilterName(propertyGroupText.name)).toBeDisabled();

    });

    await test.step('Reset all filters and verify that all filters are enabled', async () => {
        await StorefrontHome.filerResetAllButton.click();
        await ShopCustomer.expects(await StorefrontHome.getPropertyFilterByFilterName(propertyGroupText.name)).toBeEnabled();
        await ShopCustomer.expects(await StorefrontHome.getPropertyFilterByFilterName(propertyGroupColor.name)).toBeEnabled();
    });

    await test.step('Select another manufacturer and verify that a different filter is disabled', async () => {
        await StorefrontHome.manufacturerFilter.click();
        await (await StorefrontHome.getManufacturerFilterItemByManufacturerName(manufacturer2.name)).click();
        await ShopCustomer.expects(await StorefrontHome.getPropertyFilterByFilterName(propertyGroupColor.name)).toBeDisabled();
    });

});

// test('Should disable some filters if filtered by size', async ({ ShopCustomer }) => {

// });
//
// test('Should disable free shipping filter', async ({ ShopCustomer }) => {

// });
//
// test('Should filter by rating and disable not possible rating filter options', async ({ ShopCustomer }) => {

// });
