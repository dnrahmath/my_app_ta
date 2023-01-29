import 'package:get/instance_manager.dart';
import 'package:my_app_ta/controller/cart_controller.dart';

class CartBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => CartController());
  }
}
