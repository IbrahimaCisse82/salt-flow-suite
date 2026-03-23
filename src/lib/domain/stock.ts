/**
 * Stock domain logic — pure functions for inventory calculations.
 * Actual mutations go through Supabase RPC for atomicity.
 */
import { supabase } from '@/integrations/supabase/client';
import { toDecimal, toMoney, calculateCMP } from './currency';

export interface StockMovementParams {
  itemId: string;
  quantity: number;
  movementType: 'entry' | 'exit' | 'adjustment' | 'transfer';
  unitCost?: number;
  warehouseFrom?: string;
  warehouseTo?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

/**
 * Process a stock movement atomically via RPC.
 * Prevents race conditions by using a PostgreSQL function
 * with row-level locking (SELECT FOR UPDATE).
 */
export const processStockMovement = async (params: StockMovementParams) => {
  const { data, error } = await supabase.rpc('process_stock_movement', {
    p_item_id: params.itemId,
    p_quantity: params.quantity,
    p_movement_type: params.movementType,
    p_unit_cost: params.unitCost ?? 0,
    p_warehouse_from: params.warehouseFrom ?? null,
    p_warehouse_to: params.warehouseTo ?? null,
    p_reference_type: params.referenceType ?? null,
    p_reference_id: params.referenceId ?? null,
    p_notes: params.notes ?? null,
  });

  if (error) throw error;
  return data;
};

/** Calculate available stock (total - reserved) */
export const calculateAvailableStock = (
  totalQuantity: number,
  reservedQuantity: number
): number => {
  return toDecimal(totalQuantity).minus(toDecimal(reservedQuantity)).toNumber();
};

/** Check if a sale quantity is available */
export const isStockAvailable = (
  availableQty: number,
  requestedQty: number
): boolean => {
  return toDecimal(availableQty).greaterThanOrEqualTo(toDecimal(requestedQty));
};

/** Recompute CMP after a stock entry */
export const recomputeCMP = (
  currentQty: number,
  currentCMP: number,
  entryQty: number,
  entryCost: number
): number => {
  return calculateCMP(currentQty, currentCMP, entryQty, entryCost);
};

/** Calculate total stock value */
export const calculateStockValue = (quantity: number, cmp: number): number => {
  return toMoney(toDecimal(quantity).times(toDecimal(cmp)));
};
