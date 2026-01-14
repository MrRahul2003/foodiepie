"use server";
import { connectDB } from "@/src/lib/db";
import Order from "@/src/models/OrderModel";
import CustomerProfile from "@/src/models/CustomerProfileModel";
import {
  broadcastToAdminAction,
  broadcastToCustomerAction,
} from "./broadcastActions";

// WebSocket event constants (inline to avoid importing objects in server actions)
const WS_EVENTS = {
  ORDER_PLACED: "order:placed",
  ORDER_UPDATED: "order:updated",
  ORDER_STATUS_CHANGED: "order:status_changed",
};

/* ---------------- HELPERS ---------------- */
function serializePlain(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serializePlain);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = serializePlain(value[key]);
    }
    return result;
  }
  return value;
}

function generateOrderId() {
  // Format: 01XXXXX (7 digits starting with 01)
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `01${timestamp}${random}`;
}

/* ---------------- PLACE ORDER ---------------- */
export async function placeOrderAction(orderData) {
  try {
    await connectDB();

    const {
      restoId,
      restoCode,
      restoName,
      customerPhone,
      customerName,
      tableNumber,
      items,
      subtotal,
      tax,
      discount,
      deliveryFee,
      total,
      paymentMethod,
    } = orderData;

    // Validate required fields
    if (!restoId || !customerPhone || !tableNumber || !items?.length) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Generate unique order ID
    let orderId = generateOrderId();
    
    // Check if orderId exists, regenerate if needed
    let existingOrder = await Order.findOne({ orderId });
    while (existingOrder) {
      orderId = generateOrderId();
      existingOrder = await Order.findOne({ orderId });
    }

    // Create order
    const newOrder = await Order.create({
      orderId,
      restoId,
      restoCode: restoCode || "",
      restoName: restoName || "",
      customerPhone,
      customerName: customerName || "",
      tableNumber,
      items: items.map((item) => ({
        foodId: item.foodId || item._id,
        name: item.name,
        foodType: item.foodType,
        imageUrl: item.imageUrl || "",
        variant: {
          label: item.variant.label,
          price: item.variant.price,
        },
        quantity: item.quantity,
      })),
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      deliveryFee: deliveryFee || 0,
      total,
      paymentMethod: paymentMethod || "Cash",
      status: "Placed",
    });

    // Update customer profile with order reference
    await CustomerProfile.findOneAndUpdate(
      { phone: customerPhone, restoId },
      { $push: { orders: newOrder._id }, updatedAt: new Date() }
    );

    const serializedOrder = serializePlain(newOrder.toObject());

    // Broadcast new order to admin (real-time notification)
    await broadcastToAdminAction(restoId, WS_EVENTS.ORDER_PLACED, {
      order: serializedOrder,
    });

    return {
      success: true,
      order: serializedOrder,
    };
  } catch (error) {
    console.error("Place Order Error:", error);
    return {
      success: false,
      error: error.message || "Failed to place order",
    };
  }
}

/* ---------------- GET ORDERS FOR CUSTOMER ---------------- */
export async function getCustomerOrdersAction(customerPhone, restoId) {
  try {
    await connectDB();

    const orders = await Order.find({
      customerPhone,
      restoId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      orders: serializePlain(orders),
    };
  } catch (error) {
    console.error("Get Customer Orders Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/* ---------------- GET ORDERS FOR RESTAURANT (ADMIN) ---------------- */
export async function getRestaurantOrdersAction(restoId) {
  try {
    await connectDB();

    const orders = await Order.find({
      restoId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      orders: serializePlain(orders),
    };
  } catch (error) {
    console.error("Get Restaurant Orders Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/* ---------------- GET ACTIVE ORDERS FOR RESTAURANT ---------------- */
export async function getActiveRestaurantOrdersAction(restoId) {
  try {
    await connectDB();

    const orders = await Order.find({
      restoId,
      status: { $in: ["Placed", "Accepted", "Preparing"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      orders: serializePlain(orders),
    };
  } catch (error) {
    console.error("Get Active Orders Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/* ---------------- UPDATE ORDER STATUS ---------------- */
export async function updateOrderStatusAction(orderId, newStatus) {
  try {
    await connectDB();

    const validStatuses = ["Placed", "Accepted", "Preparing", "Served", "Cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: "Invalid status",
      };
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { status: newStatus },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    const serializedOrder = serializePlain(updatedOrder);

    // Broadcast status change to customer (real-time notification)
    await broadcastToCustomerAction(
      updatedOrder.restoId,
      updatedOrder.customerPhone,
      WS_EVENTS.ORDER_STATUS_CHANGED,
      {
        orderId: updatedOrder.orderId,
        status: newStatus,
        order: serializedOrder,
      }
    );

    // Also broadcast to all admins for this restaurant
    await broadcastToAdminAction(
      updatedOrder.restoId,
      WS_EVENTS.ORDER_UPDATED,
      {
        orderId: updatedOrder.orderId,
        status: newStatus,
        order: serializedOrder,
      }
    );

    return {
      success: true,
      order: serializedOrder,
    };
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/* ---------------- GET ORDER STATS FOR RESTAURANT ---------------- */
export async function getOrderStatsAction(restoId) {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's orders
    const todayOrders = await Order.find({
      restoId,
      createdAt: { $gte: today },
    }).lean();

    // Calculate stats
    const sessionOrders = todayOrders.length;
    const sessionRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrders = todayOrders.filter(
      (o) => ["Placed", "Accepted", "Preparing"].includes(o.status)
    ).length;
    const servedOrders = todayOrders.filter((o) => o.status === "Served").length;

    return {
      success: true,
      stats: {
        sessionOrders,
        sessionRevenue,
        activeOrders,
        servedOrders,
      },
    };
  } catch (error) {
    console.error("Get Order Stats Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/* ---------------- GET DASHBOARD STATS FOR RESTAURANT ---------------- */
export async function getDashboardStatsAction(restoId) {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Get all orders for restaurant
    const allOrders = await Order.find({ restoId }).lean();
    
    // Today's orders
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
    
    // Yesterday's orders
    const yesterdayOrders = allOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= yesterday && d < today;
    });
    
    // This week's orders
    const weekOrders = allOrders.filter(o => new Date(o.createdAt) >= weekAgo);
    
    // This month's orders
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthAgo);

    // Calculate stats
    const todayStats = {
      orders: todayOrders.length,
      revenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      activeOrders: todayOrders.filter(o => ["Placed", "Accepted", "Preparing"].includes(o.status)).length,
      servedOrders: todayOrders.filter(o => o.status === "Served").length,
      cancelledOrders: todayOrders.filter(o => o.status === "Cancelled").length,
    };
    
    const yesterdayStats = {
      orders: yesterdayOrders.length,
      revenue: yesterdayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };
    
    const weekStats = {
      orders: weekOrders.length,
      revenue: weekOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };
    
    const monthStats = {
      orders: monthOrders.length,
      revenue: monthOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };
    
    const allTimeStats = {
      orders: allOrders.length,
      revenue: allOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };

    // Get recent orders (last 5)
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Order status breakdown for today
    const statusBreakdown = {
      placed: todayOrders.filter(o => o.status === "Placed").length,
      accepted: todayOrders.filter(o => o.status === "Accepted").length,
      preparing: todayOrders.filter(o => o.status === "Preparing").length,
      served: todayOrders.filter(o => o.status === "Served").length,
      cancelled: todayOrders.filter(o => o.status === "Cancelled").length,
    };

    // Calculate growth percentage
    const revenueGrowth = yesterdayStats.revenue > 0 
      ? ((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue * 100).toFixed(1)
      : todayStats.revenue > 0 ? 100 : 0;
    
    const orderGrowth = yesterdayStats.orders > 0 
      ? ((todayStats.orders - yesterdayStats.orders) / yesterdayStats.orders * 100).toFixed(1)
      : todayStats.orders > 0 ? 100 : 0;

    return {
      success: true,
      data: {
        today: todayStats,
        yesterday: yesterdayStats,
        week: weekStats,
        month: monthStats,
        allTime: allTimeStats,
        recentOrders: serializePlain(recentOrders),
        statusBreakdown,
        growth: {
          revenue: parseFloat(revenueGrowth),
          orders: parseFloat(orderGrowth),
        },
      },
    };
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
