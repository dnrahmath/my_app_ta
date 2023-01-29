import 'package:get/instance_manager.dart';
import 'package:my_app_ta/controller/product_controller.dart';

class ProductBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => ProductController());
  }
}
