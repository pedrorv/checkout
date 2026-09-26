import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  formatPrice,
  Input,
  Label,
  Select,
} from "@/shared";
import { usePayOrder } from "../hooks/usePayOrder.mutation";
import { useUpdateOrder } from "../hooks/useUpdateOrder.mutation";
import { getOrderErrorMessage } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderDTO } from "../orders.types";

type PayDialogProps = {
  order: OrderDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CustomerForm = {
  name: string;
  email: string;
};

type CardForm = {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
};

const initialCard: CardForm = {
  number: "",
  expMonth: "",
  expYear: "",
  cvc: "",
};

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const YEARS = Array.from({ length: 10 }, (_, index) =>
  String(new Date().getFullYear() + index),
);

export const maskCardNumber = (value: string) =>
  value
    .replace(/[\s-]/g, "")
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

export function PayDialog({ order, open, onOpenChange }: PayDialogProps) {
  const navigate = useNavigate();
  const clearActiveOrder = useOrderStore((state) => state.clear);
  const updateOrder = useUpdateOrder();
  const payOrder = usePayOrder();

  const [step, setStep] = useState<1 | 2>(1);
  const [customer, setCustomer] = useState<CustomerForm>({
    name: order.customerName,
    email: order.customerEmail,
  });
  const [card, setCard] = useState<CardForm>(initialCard);

  const customerValid =
    customer.name.trim().length > 0 && /.+@.+\..+/.test(customer.email.trim());
  const cardValid =
    card.number.replace(/\s/g, "").length >= 13 &&
    card.expMonth !== "" &&
    card.expYear !== "" &&
    /^\d{3,4}$/.test(card.cvc);

  const closeDialog = () => {
    setStep(1);
    setCard(initialCard);
    onOpenChange(false);
  };

  const handleCustomerStep = () => {
    updateOrder.mutate(
      {
        id: order.id,
        customerName: customer.name.trim(),
        customerEmail: customer.email.trim(),
      },
      {
        onSuccess: () => setStep(2),
        onError: (error) => toast.error(getOrderErrorMessage(error)),
      },
    );
  };

  const handlePay = () => {
    payOrder.mutate(
      {
        id: order.id,
        card: {
          number: card.number,
          expMonth: Number(card.expMonth),
          expYear: Number(card.expYear),
          cvc: card.cvc,
        },
      },
      {
        onSuccess: (completed) => {
          clearActiveOrder();
          closeDialog();
          navigate(`/orders/${completed.id}`);
        },
        onError: (error) => toast.error(getOrderErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Your details" : "Payment"}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? `Total: ${formatPrice(order.total)}`
              : `Paying ${formatPrice(order.total)} for ${order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                )} item(s)`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCustomerStep();
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={customer.name}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
                maxLength={255}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={customer.email}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                required
                maxLength={255}
              />
            </div>
            <Button
              type="submit"
              disabled={!customerValid || updateOrder.isPending}
            >
              {updateOrder.isPending ? "Saving..." : "Continue to payment"}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handlePay();
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-holder">Cardholder name</Label>
              <Input
                id="card-holder"
                placeholder="Name on card"
                maxLength={255}
                autoComplete="cc-name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={card.number}
                onChange={(event) =>
                  setCard((prev) => ({
                    ...prev,
                    number: maskCardNumber(event.target.value),
                  }))
                }
                autoComplete="cc-number"
                required
              />
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="card-exp-month">Month</Label>
                <Select
                  id="card-exp-month"
                  value={card.expMonth}
                  onChange={(event) =>
                    setCard((prev) => ({
                      ...prev,
                      expMonth: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    MM
                  </option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="card-exp-year">Year</Label>
                <Select
                  id="card-exp-year"
                  value={card.expYear}
                  onChange={(event) =>
                    setCard((prev) => ({
                      ...prev,
                      expYear: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    YYYY
                  </option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="card-cvc">CVC</Label>
                <Input
                  id="card-cvc"
                  inputMode="numeric"
                  placeholder="123"
                  value={card.cvc}
                  onChange={(event) =>
                    setCard((prev) => ({
                      ...prev,
                      cvc: event.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  autoComplete="cc-csc"
                  required
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Test cards: 4242 4242 4242 4242 is approved, 4000 0000 0000 0002
              is declined.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!cardValid || payOrder.isPending}
              >
                {payOrder.isPending
                  ? "Paying..."
                  : `Pay ${formatPrice(order.total)}`}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
