import { getRepository, Repository } from 'typeorm';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IFindProductsDTO from '@modules/products/dtos/IFindProductsDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    return this.ormRepository.findOne({ where: { name } });
  }

  public async findAllById({
    product_ids,
  }: IFindProductsDTO): Promise<Product[]> {
    return this.ormRepository.findByIds(product_ids);
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds: string[] = products.map(product => product.id);
    const foundProducts = await this.ormRepository.findByIds(productsIds);

    foundProducts.forEach(async (foundProduct, index) => {
      const productWithNewQuantity = products.find(
        product => product.id === foundProduct.id,
      );

      if (!productWithNewQuantity) {
        throw new AppError('Product not found');
      }

      foundProducts[index].quantity = productWithNewQuantity?.quantity;
    });

    await this.ormRepository.save(foundProducts);

    return foundProducts;
  }
}

export default ProductsRepository;
