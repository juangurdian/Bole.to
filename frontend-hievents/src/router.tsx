import {Navigate, RouteObject} from "react-router";
import ErrorPage from "./error-page.tsx";
import {useEffect, useState} from "react";
import {useGetMe} from "./queries/useGetMe.ts";
import {publicEventRouteLoader} from "./routeLoaders/publicEventRouteLoader.ts";
import {publicOrganizerRouteLoader} from "./routeLoaders/publicOrganizerRouteLoader.ts";

const Root = () => {
    const [redirectPath, setRedirectPath] = useState<string | null>(null);
    const me = useGetMe();

    useEffect(() => {
        if (me.isFetched) {
            setRedirectPath(me.isSuccess ? "/manage/events" : "/auth/login");
        }
    }, [me.isFetched]);

    if (redirectPath) {
        return <Navigate to={redirectPath} replace={true}/>;
    }
};

export const router: RouteObject[] = [
    {
        path: "",
        element: <Root/>,
        errorElement: <ErrorPage/>
    },
    {
        path: "auth",
        async lazy() {
            const AuthLayout = await import("./components/layouts/AuthLayout/index.tsx");
            return {Component: AuthLayout.default};
        },
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "login",
                async lazy() {
                    const Login = await import("./components/routes/auth/Login/index.tsx");
                    return {Component: Login.default};
                },
            },
            {
                path: "register",
                async lazy() {
                    const Register = await import("./components/routes/auth/Register/index.tsx");
                    return {Component: Register.default};
                }
            },
            {
                path: "forgot-password",
                async lazy() {
                    const ForgotPassword = await import("./components/routes/auth/ForgotPassword/index.tsx");
                    return {Component: ForgotPassword.default};
                }
            },
            {
                path: "reset-password/:token",
                async lazy() {
                    const ResetPassword = await import("./components/routes/auth/ResetPassword/index.tsx");
                    return {Component: ResetPassword.default};
                }
            },
            {
                path: "accept-invitation/:token",
                async lazy() {
                    const AcceptInvitation = await import("./components/routes/auth/AcceptInvitation/index.tsx");
                    return {Component: AcceptInvitation.default};
                }
            }
        ]
    },
    {
        path: "manage",
        errorElement: <ErrorPage/>,
        async lazy() {
            const DefaultLayout = await import("./components/layouts/DefaultLayout/index.tsx");
            return {Component: DefaultLayout.default};
        },
        children: [
            {
                path: "events/:eventsState?",
                async lazy() {
                    const Dashboard = await import("./components/routes/events/Dashboard/index.tsx");
                    return {Component: Dashboard.default};
                },
            },
            {
                path: "account",
                async lazy() {
                    const ManageAccount = await import("./components/routes/account/ManageAccount/index.tsx");
                    return {Component: ManageAccount.default};
                }
            },
            {
                path: "profile",
                async lazy() {
                    const ManageProfile = await import("./components/routes/profile/ManageProfile/index.tsx");
                    return {Component: ManageProfile.default};
                }
            },
            {
                path: "profile/confirm-email-change/:token",
                async lazy() {
                    const ConfirmEmailChange = await import("./components/routes/profile/ConfirmEmailChange/index.tsx");
                    return {Component: ConfirmEmailChange.default};
                }
            },
            {
                path: "profile/confirm-email-address/:token",
                async lazy() {
                    const ConfirmEmailAddress = await import("./components/routes/profile/ConfirmEmailAddress/index.tsx");
                    return {Component: ConfirmEmailAddress.default};
                }
            },
        ]
    },
    {
        path: "welcome",
        async lazy() {
            const WelcomeLayout = await import("./components/layouts/WelcomeLayout/index.tsx");
            return {Component: WelcomeLayout.default};
        },
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "",
                async lazy() {
                    const Welcome = await import("./components/routes/welcome/index.tsx");
                    return {Component: Welcome.default};
                }
            },
        ]
    },
    {
        path: "account",
        errorElement: <ErrorPage/>,
        async lazy() {
            const DefaultLayout = await import("./components/layouts/DefaultLayout/index.tsx");
            return {Component: DefaultLayout.default};
        },
        children: [
            {
                path: "",
                async lazy() {
                    const ManageAccount = await import("./components/routes/account/ManageAccount/index.tsx");
                    return {Component: ManageAccount.default};
                },
                children: [
                    {
                        path: "settings",
                        async lazy() {
                            const AccountSettings = await import("./components/routes/account/ManageAccount/sections/AccountSettings/index.tsx");
                            return {Component: AccountSettings.default};
                        }
                    },
                    {
                        path: "taxes-and-fees",
                        async lazy() {
                            const TaxSettings = await import("./components/routes/account/ManageAccount/sections/TaxSettings/index.tsx");
                            return {Component: TaxSettings.default};
                        }
                    },
                    {
                        path: "event-defaults",
                        async lazy() {
                            const EventDefaultsSettings = await import("./components/routes/account/ManageAccount/sections/EventDefaultsSettings/index.tsx");
                            return {Component: EventDefaultsSettings.default};
                        }
                    },
                    {
                        path: "users",
                        async lazy() {
                            const Users = await import("./components/routes/account/ManageAccount/sections/Users/index.tsx");
                            return {Component: Users.default};
                        }
                    },
                    {
                        path: "payment",
                        async lazy() {
                            const PaymentSettings = await import("./components/routes/account/ManageAccount/sections/PaymentSettings/index.tsx");
                            return {Component: PaymentSettings.default};
                        }
                    },
                ]
            },
        ]
    },
    {
        path: "/manage/organizer/:organizerId?",
        async lazy() {
            const Dashboard = await import("./components/layouts/OrganizerLayout/index.tsx");
            return {Component: Dashboard.default};
        },
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "dashboard?",
                async lazy() {
                    const OrganizerDashboard = await import("./components/routes/organizer/OrganizerDashboard/index.tsx");
                    return {Component: OrganizerDashboard.default};
                }
            },
            {
                path: "events/:eventsState?",
                async lazy() {
                    const Events = await import("./components/routes/organizer/Events/index.tsx");
                    return {Component: Events.default};
                }
            },
            {
                path: "settings",
                async lazy() {
                    const Settings = await import("./components/routes/organizer/Settings/index.tsx");
                    return {Component: Settings.default};
                }
            },
            {
                path: "organizer-homepage-designer",
                async lazy() {
                    const OrganizerHomepageDesigner = await import("./components/routes/organizer/OrganizerHomepageDesigner/index.tsx");
                    return {Component: OrganizerHomepageDesigner.default};
                }
            }
        ],
    },
    {
        path: "/manage/event/:eventId",
        async lazy() {
            const EventLayout = await import("./components/layouts/Event/index.tsx");
            return {Component: EventLayout.default};
        },
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "",
                async lazy() {
                    const EventDashboard = await import("./components/routes/event/EventDashboard/index.tsx");
                    return {Component: EventDashboard.default};
                }
            },
            {
                path: "dashboard",
                async lazy() {
                    const EventDashboard = await import("./components/routes/event/EventDashboard/index.tsx");
                    return {Component: EventDashboard.default};
                }
            },
            {
                path: "reports",
                async lazy() {
                    const Reports = await import("./components/routes/event/Reports/index.tsx");
                    return {Component: Reports.default};
                },
            },
            {
                path: "report/:reportType",
                async lazy() {
                    const ReportLayout = await import("./components/routes/event/Reports/ReportLayout/index.tsx");
                    return {Component: ReportLayout.default};
                },
            },
            {
                path: "products",
                async lazy() {
                    const Products = await import("./components/routes/event/products.tsx");
                    return {Component: Products.default};
                }
            },
            {
                path: "attendees",
                async lazy() {
                    const Attendees = await import("./components/routes/event/attendees.tsx");
                    return {Component: Attendees.default};
                }
            },
            {
                path: "questions",
                async lazy() {
                    const Questions = await import("./components/routes/event/questions.tsx");
                    return {Component: Questions.default};
                }
            },
            {
                path: "orders",
                async lazy() {
                    const Orders = await import("./components/routes/event/orders.tsx");
                    return {Component: Orders.default};
                }
            },
            {
                path: "promo-codes",
                async lazy() {
                    const PromoCodes = await import("./components/routes/event/promo-codes.tsx");
                    return {Component: PromoCodes.default};
                }
            },
            {
                path: "affiliates",
                async lazy() {
                    const Affiliates = await import("./components/routes/event/Affiliates/index.tsx");
                    return {Component: Affiliates.default};
                }
            },
            {
                path: "check-in",
                async lazy() {
                    const CheckIn = await import("./components/routes/event/CheckInLists/index.tsx");
                    return {Component: CheckIn.default};
                }
            },
            {
                path: "messages",
                async lazy() {
                    const Messages = await import("./components/routes/event/messages.tsx");
                    return {Component: Messages.default};
                }
            },
            {
                path: "settings",
                async lazy() {
                    const Settings = await import("./components/routes/event/Settings/index.tsx");
                    return {Component: Settings.default};
                }
            },
            {
                path: "widget",
                async lazy() {
                    const Widget = await import("./components/routes/event/widget.tsx");
                    return {Component: Widget.default};
                }
            },
            {
                path: "homepage-designer",
                async lazy() {
                    const HomepageDesigner = await import("./components/routes/event/HomepageDesigner/index.tsx");
                    return {Component: HomepageDesigner.default};
                }
            },
            {
                path: "getting-started",
                async lazy() {
                    const GettingStarted = await import("./components/routes/event/GettingStarted/index.tsx");
                    return {Component: GettingStarted.default};
                }
            },
            {
                path: "capacity-assignments",
                async lazy() {
                    const CapacityAssignments = await import("./components/routes/event/CapacityAssignments/index.tsx");
                    return {Component: CapacityAssignments.default};
                }
            },
            {
                path: "webhooks",
                async lazy() {
                    const Webhooks = await import("./components/routes/event/Webhooks/index.tsx");
                    return {Component: Webhooks.default};
                }
            }
        ]
    },
    {
        path: "/events/:organizerId/:organizerSlug",
        loader: publicOrganizerRouteLoader,
        async lazy() {
            const PublicOrganizer = await import("./components/layouts/PublicOrganizer/index.tsx");
            return {Component: PublicOrganizer.default};
        },
        errorElement: <ErrorPage/>,
    },
    {
        path: "/events/:organizerId/:organizerSlug/past-events",
        loader: publicOrganizerRouteLoader,
        async lazy() {
            const PublicOrganizer = await import("./components/layouts/PublicOrganizer/index.tsx");
            return {Component: PublicOrganizer.default};
        },
        errorElement: <ErrorPage/>,
    },
    {
        path: "/e/:eventId/:eventSlug",
        async lazy() {
            const EventHomepage = await import("./components/layouts/EventHomepage/index.tsx");
            return {Component: EventHomepage.default};
        },
        errorElement: <ErrorPage/>,
    },
    {
        path: "/event/:eventId/preview",
        async lazy() {
            const EventHomepagePreview = await import("./components/layouts/EventHomepagePreview/index.tsx");
            return {Component: EventHomepagePreview.default};
        },
    },
    {
        path: "/organizer/:organizerId/preview",
        loader: publicOrganizerRouteLoader,
        async lazy() {
            const OrganizerHomepagePreview = await import("./components/layouts/OrganizerHomepagePreview/index.tsx");
            return {Component: OrganizerHomepagePreview.default};
        },
    },
    {
        path: "/event/:eventId/:eventSlug",
        loader: publicEventRouteLoader,
        async lazy() {
            const PublicEvent = await import("./components/layouts/PublicEvent/index.tsx");
            return {Component: PublicEvent.default};
        },
        errorElement: <ErrorPage/>,
    },
    {
        path: "/widget/:eventId",
        async lazy() {
            const ProductWidget = await import("./components/layouts/ProductWidget/index.tsx");
            return {Component: ProductWidget.default};
        },
        errorElement: <ErrorPage/>,
    },
    {
        path: "/checkout/:eventId",
        async lazy() {
            const Checkout = await import("./components/layouts/Checkout/index.tsx");
            return {Component: Checkout.default};
        },
        errorElement: <ErrorPage/>,
        children: [
            {
                path: ":orderShortId/details",
                async lazy() {
                    const CollectInformation = await import("./components/routes/product-widget/CollectInformation/index.tsx");
                    return {Component: CollectInformation.default};
                }
            },
            {
                path: ":orderShortId/payment",
                async lazy() {
                    const Payment = await import("./components/routes/product-widget/Payment/index.tsx");
                    return {Component: Payment.default};
                }
            },
            {
                path: ":orderShortId/summary",
                async lazy() {
                    const OrderSummaryAndProducts = await import("./components/routes/product-widget/OrderSummaryAndProducts/index.tsx");
                    return {Component: OrderSummaryAndProducts.default};
                }
            },
            {
                path: ":orderShortId/payment_return",
                async lazy() {
                    const PaymentReturn = await import("./components/routes/product-widget/PaymentReturn/index.tsx");
                    return {Component: PaymentReturn.default};
                }
            },
        ]
    },
    {
        path: "/order/:eventId/:orderShortId/print",
        async lazy() {
            const PrintOrder = await import("./components/routes/product-widget/PrintOrder/index.tsx");
            return {Component: PrintOrder.default};
        },
        errorElement: <ErrorPage/>
    },
    {
        path: "/product/:eventId/:attendeeShortId/print",
        async lazy() {
            const PrintProduct = await import("./components/routes/product-widget/PrintProduct/index.tsx");
            return {Component: PrintProduct.default};
        },
        errorElement: <ErrorPage/>
    },
    {
        path: "/product/:eventId/:attendeeShortId",
        async lazy() {
            const AttendeeProductAndInformation = await import("./components/routes/product-widget/AttendeeProductAndInformation/index.tsx");
            return {Component: AttendeeProductAndInformation.default};
        },
        errorElement: <ErrorPage/>
    },
    {
        path: "/check-in/:checkInListShortId",
        async lazy() {
            const CheckIn = await import("./components/layouts/CheckIn/index.tsx");
            return {Component: CheckIn.default};
        },
        errorElement: <ErrorPage/>,
    }
];

