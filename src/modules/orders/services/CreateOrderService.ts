import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IProductsToCreate {
  product_id: string;
  quantity: number;
  price: number;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    try {
      const customer = await this.customersRepository.findById(customer_id);

      if (!customer) {
        throw new AppError('Customer not found');
      }

      const productsIds: string[] = products.map(product => product.id);

      const findProducts = await this.productsRepository.findAllById({
        product_ids: productsIds,
      });

      const productsToCreate: IProductsToCreate[] = [];

      const newProductsQuantity: IProduct[] = products.map(product => {
        const filteredProduct = findProducts.find(
          findProduct => findProduct.id === product.id,
        );

        if (!filteredProduct) {
          throw new AppError('Some product does not exists');
        }

        if (filteredProduct.quantity < product.quantity) {
          throw new AppError('Some product have insufficient quantities');
        }

        productsToCreate.push({
          product_id: product.id,
          quantity: product.quantity,
          price: filteredProduct.price,
        });

        return {
          id: product.id,
          quantity: filteredProduct.quantity - product.quantity,
        };
      });

      const order = await this.ordersRepository.create({
        customer,
        products: productsToCreate,
      });

      await this.productsRepository.updateQuantity(newProductsQuantity);

      return order;
    } catch (err) {
      throw new AppError(err);
    }
  }
}

export default CreateOrderService;
