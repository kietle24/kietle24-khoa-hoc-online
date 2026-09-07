import Payment, { InitiateProps } from "./payment";
import { responses } from "../config/strings";
import { PayOS } from "@payos/node";
import { SiteInfo, UIConstants } from "@courselit/common-models";
import { getUnitAmount } from "./helpers";

const {
    payment_invalid_settings: paymentInvalidSettings,
    currency_iso_not_set: currencyISONotSet,
} = responses;

export default class PayOSPayment implements Payment {
    public siteinfo: SiteInfo;
    public name: string;
    public payOS: any;

    constructor(siteinfo: SiteInfo) {
        this.siteinfo = siteinfo;
        this.name = UIConstants.PAYMENT_METHOD_PAYOS;
    }

    async setup() {
        if (!this.siteinfo.currencyISOCode) {
            // Default to VND if not explicitly set for PayOS
            this.siteinfo.currencyISOCode = "VND";
        }

        const clientId =
            this.siteinfo.payosClientId || process.env.PAYOS_CLIENT_ID;
        const apiKey = this.siteinfo.payosApiKey || process.env.PAYOS_API_KEY;
        const checksumKey =
            this.siteinfo.payosChecksumKey || process.env.PAYOS_CHECKSUM_KEY;

        if (!clientId || !apiKey || !checksumKey) {
            throw new Error(`${this.name} ${paymentInvalidSettings}`);
        }

        this.payOS = new PayOS({
            clientId,
            apiKey,
            checksumKey,
        });

        return this;
    }

    async initiate({ metadata, paymentPlan, product, origin }: InitiateProps) {
        const unitAmount = getUnitAmount(paymentPlan);
        const amount = Math.round(unitAmount);

        // PayOS requires an integer orderCode (max: 9007199254740991)
        const orderCode = Number(
            String(Date.now()).slice(-6) +
                Math.floor(Math.random() * 1000)
                    .toString()
                    .padStart(3, "0"),
        );

        const paymentData = {
            orderCode,
            amount: amount > 0 ? amount : 10000,
            description: `DH ${metadata.invoiceId.slice(0, 8)}`.slice(0, 25),
            items: [
                {
                    name: product.title.slice(0, 50),
                    quantity: 1,
                    price: amount > 0 ? amount : 10000,
                },
            ],
            returnUrl: `${origin}/checkout/verify?id=${metadata.invoiceId}`,
            cancelUrl: `${origin}/checkout?type=${product.type}&id=${product.id}`,
        };

        const paymentLinkRes =
            await this.payOS.paymentRequests.create(paymentData);

        return paymentLinkRes.checkoutUrl;
    }

    async getCurrencyISOCode() {
        return this.siteinfo.currencyISOCode || "VND";
    }

    async verify(event: any) {
        if (!event) {
            return false;
        }

        try {
            // Verify webhook payload signature using PayOS Webhooks resource
            const verifiedData = await this.payOS.webhooks.verify(event);
            if (
                verifiedData &&
                (event.code === "00" || event.success === true)
            ) {
                return true;
            }
            return !!verifiedData;
        } catch (e) {
            // Direct data fallback
            if (event.code === "00" || event.desc === "success") {
                return true;
            }
            return false;
        }
    }

    getPaymentIdentifier(event: any) {
        return (
            event?.data?.paymentLinkId ||
            event?.data?.orderCode ||
            event?.orderCode ||
            event?.id ||
            "payos_tx"
        );
    }

    getMetadata(event: any) {
        const description =
            event?.data?.description || event?.description || "";
        return {
            description,
            currencyISOCode: event?.data?.currency || "VND",
        };
    }

    getName() {
        return this.name;
    }

    async cancel(id: string) {
        try {
            await this.payOS.paymentRequests.cancel(Number(id));
            return true;
        } catch (error: any) {
            return false;
        }
    }

    getSubscriptionId(event: any): string {
        return "";
    }

    async validateSubscription(subscriptionId: string) {
        return true;
    }
}
